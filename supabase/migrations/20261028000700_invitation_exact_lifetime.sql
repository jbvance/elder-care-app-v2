-- Use one database clock reading for an exact seven-day lifetime.
create or replace function private.issue_invitation(p_scope uuid,p_recipient text,p_operation uuid,p_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare s private.prompting_scopes; i private.invitations; issued timestamptz;
begin
 perform public.check_private_session();
 select * into s from private.prompting_scopes where id=p_scope for update;
 perform public.check_private_session();
 if s.id is null or s.permission_author<>auth.uid() or not s.shareable or not s.authority_active then raise sqlstate 'PT403' using message='Current sharing authority is required.'; end if;
 p_recipient:=lower(btrim(p_recipient));
 if p_recipient is null or p_recipient !~ '^[^[:space:]@]+@example[.]test$' or length(p_recipient)>254 or p_token is null or p_token !~ '^[a-f0-9]{64}$' or p_operation is null then raise sqlstate 'PT400' using message='Use a fictional recipient and valid operation.'; end if;
 select * into i from private.invitations where inviter=auth.uid() and operation=p_operation;
 if found then
 if i.scope_id<>p_scope or i.recipient<>p_recipient or i.token_hash<>encode(extensions.digest(p_token,'sha256'),'hex') then raise sqlstate 'PT409' using message='Operation already used.'; end if;
 return i.id; end if;
 update private.invitations set state='replaced' where scope_id=p_scope and recipient=p_recipient and state='pending';
 issued:=clock_timestamp();
 insert into private.invitations(scope_id,inviter,recipient,operation,token_hash,issued_at,expires_at) values(p_scope,auth.uid(),p_recipient,p_operation,encode(extensions.digest(p_token,'sha256'),'hex'),issued,issued+interval '7 days') returning id into i.id;
 return i.id;
end $$;
notify pgrst, 'reload schema';
