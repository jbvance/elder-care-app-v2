const { withAndroidManifest, withAppDelegate, withDangerousMod, withMainApplication } = require('expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const fs = require('node:fs/promises');
const path = require('node:path');

const exclusions = ['root', 'file', 'database', 'sharedpref', 'external']
  .map((domain) => `    <exclude domain="${domain}" path="."/>`).join('\n');

module.exports = function withPrivateDraftProtection(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) throw new Error('Missing Android application manifest');
    application.$['android:allowBackup'] = 'false';
    application.$['android:fullBackupContent'] = '@xml/private_draft_backup_rules';
    application.$['android:dataExtractionRules'] = '@xml/private_draft_extraction_rules';
    return mod;
  });
  config = withDangerousMod(config, ['android', async (mod) => {
    const resources = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    await fs.mkdir(resources, { recursive: true });
    await fs.writeFile(path.join(resources, 'private_draft_backup_rules.xml'), `<full-backup-content>\n${exclusions}\n</full-backup-content>\n`);
    await fs.writeFile(path.join(resources, 'private_draft_extraction_rules.xml'), `<data-extraction-rules>\n  <cloud-backup>\n${exclusions}\n  </cloud-backup>\n  <device-transfer>\n${exclusions}\n  </device-transfer>\n</data-extraction-rules>\n`);
    return mod;
  }]);
  config = withMainApplication(config, (mod) => {
    if (mod.modResults.language !== 'kt') throw new Error('Private draft protection requires the generated Kotlin application');
    mod.modResults.contents = mergeContents({
      tag: 'private-draft-protection', src: mod.modResults.contents,
      anchor: /super\.onCreate\(\)/, offset: 1, comment: '//',
      newSrc: `    val privateDrafts = java.io.File(filesDir, "PrivateDrafts")
    try {
      if (privateDrafts.isDirectory || privateDrafts.mkdirs()) {
        java.io.File(privateDrafts, ".backup-excluded").writeText("1")
      }
    } catch (_: Exception) {
      java.io.File(privateDrafts, ".backup-excluded").delete()
    }`,
    }).contents;
    return mod;
  });
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') throw new Error('Private draft protection requires the generated Swift delegate');
    mod.modResults.contents = mergeContents({
      tag: 'private-draft-protection', src: mod.modResults.contents,
      anchor: /super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/,
      offset: 0, comment: '//',
      newSrc: `    // Exclude durable private drafts from backups before JS starts.
    let privateDrafts = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("PrivateDrafts", isDirectory: true)
    let protectionMarker = privateDrafts.appendingPathComponent(".backup-excluded")
    do {
      try FileManager.default.createDirectory(at: privateDrafts, withIntermediateDirectories: true)
      var protectedURL = privateDrafts
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try protectedURL.setResourceValues(values)
      try FileManager.default.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: privateDrafts.path)
      try Data("1".utf8).write(to: protectionMarker, options: .atomic)
    } catch {
      // Absence of the marker makes JS fail closed. Do not log paths/data.
      try? FileManager.default.removeItem(at: protectionMarker)
    }`,
    }).contents;
    return mod;
  });
};
