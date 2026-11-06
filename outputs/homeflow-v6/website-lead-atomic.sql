-- Additive migration. Existing clients, cases, tasks and access policies stay intact.
alter table public.website_lead_imports
  add column if not exists payload_hash text,
  add column if not exists payload jsonb,
  add column if not exists result jsonb;

create or replace function public.receive_website_lead(p_hash text, p_fingerprint text, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  v_import public.website_lead_imports%rowtype;
  v_email text := lower(btrim(p_payload->>'email'));
  v_phone text := nullif(p_payload->>'phone', '');
  v_name text := btrim(p_payload->>'name');
  v_client_id uuid;
  v_task_id uuid;
  v_ids uuid[];
  v_archived boolean;
  v_description text;
  v_result jsonb;
  v_received timestamptz;
  v_source text := coalesce(p_payload->>'source','debreceniotthonok.hu');
begin
  if p_hash !~ '^[a-f0-9]{64}$' or p_fingerprint !~ '^[a-f0-9]{64}$'
     or coalesce(length(v_name),0) not between 1 and 100
     or coalesce(length(v_email),0) not between 3 and 254
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or length(coalesce(p_payload->>'message','')) > 3000
     or v_source not in ('debrecenhomes.hu','debreceniotthonok.hu') then
    raise exception 'INVALID_LEAD';
  end if;
  -- All writes, including this receipt, commit together or roll back together.
  perform pg_advisory_xact_lock(hashtextextended('website-lead:' || p_hash, 0));
  select * into v_import from public.website_lead_imports where submission_hash = p_hash;
  if found then
    if v_import.payload_hash is not null and v_import.payload_hash <> p_fingerprint then
      raise exception 'SUBMISSION_CONFLICT';
    end if;
    if v_import.status = 'completed' then
      return coalesce(v_import.result, '{"success":true}'::jsonb) || '{"duplicate":true}'::jsonb;
    end if;
    -- Old non-atomic imports may already have written some records. Never replay blindly.
    raise exception 'LEGACY_PROCESSING';
  end if;
  -- Match the lock order of the existing client duplicate-guard trigger.
  if v_phone is not null then
    perform pg_advisory_xact_lock(hashtextextended('homeflow-client-phone:' || regexp_replace(v_phone, '[^0-9]', '', 'g'), 0));
  end if;
  perform pg_advisory_xact_lock(hashtextextended('homeflow-client-email:' || v_email, 0));
  select array_agg(c.id), bool_or(c.archived_at is not null) into v_ids, v_archived
  from public.clients c
  where lower(btrim(c.email)) = v_email or (v_phone is not null and
    (case
      when regexp_replace(c.phone, '[^0-9]', '', 'g') like '0036%' then '+36' || substr(regexp_replace(c.phone, '[^0-9]', '', 'g'),5)
      when regexp_replace(c.phone, '[^0-9]', '', 'g') like '06%' then '+36' || substr(regexp_replace(c.phone, '[^0-9]', '', 'g'),3)
      when regexp_replace(c.phone, '[^0-9]', '', 'g') ~ '^(20|30|31|50|70)[0-9]{7}$' then '+36' || regexp_replace(c.phone, '[^0-9]', '', 'g')
      else '+' || regexp_replace(c.phone, '[^0-9]', '', 'g') end) = v_phone);
  if coalesce(cardinality(v_ids),0) > 1 or coalesce(v_archived,false) then raise exception 'CONTACT_REVIEW'; end if;
  v_client_id := v_ids[1];
  if v_client_id is null then
    insert into public.clients(first_name,last_name,email,phone,source,notes,status,data_classification)
    values (
      coalesce(nullif(substr(v_name, strpos(v_name,' ')+1),v_name),'(nincs megadva)'),
      split_part(v_name,' ',1),v_email,v_phone,'Debreceni Otthonok',
      'Weboldali érdeklődés – ' || v_source,'Aktív','live'
    ) returning id into v_client_id;
  end if;
  v_received := coalesce(nullif(p_payload->>'receivedAt','')::timestamptz,now());
  v_description := concat_ws(E'\n',
    'Forrás: ' || v_source, 'Beküldés: ' || (p_payload->>'submissionId'),
    'Érkezés: ' || v_received::text, 'Név: ' || v_name, 'E-mail: ' || v_email,
    'Telefon: ' || coalesce(v_phone,'nincs megadva'),
    'Hirdetés: ' || coalesce(p_payload->>'propertyTitle',''),
    'Weboldali hirdetésazonosító: ' || coalesce(p_payload->>'propertyId',''),
    'Hivatkozás: ' || coalesce(p_payload->>'propertyUrl',''),
    'Üzenet: ' || coalesce(p_payload->>'message',''));
  -- Direct client task: no fabricated buyer case, and no second active buyer case.
  -- The website's Firebase listing ID is deliberately not used as a CRM property UUID.
  insert into public.tasks(title,description,type,status,priority,due_date,client_id,phone)
  values ('Visszahívás / válasz: ' || v_name,v_description,'call','todo','high',
    (((v_received at time zone 'Europe/Budapest')::date + 1) + time '10:00') at time zone 'Europe/Budapest',
    v_client_id,v_phone) returning id into v_task_id;
  insert into public.timeline_events(client_id,type,title,description,metadata)
  values(v_client_id,'system','Weboldali érdeklődés érkezett',v_description,
    jsonb_build_object('task_id',v_task_id,'source',v_source,'submission_hash',p_hash));
  v_result := jsonb_build_object('success',true,'clientId',v_client_id,'taskId',v_task_id);
  insert into public.website_lead_imports(submission_hash,status,payload_hash,payload,result)
  values(p_hash,'completed',p_fingerprint,p_payload,v_result);
  return v_result;
end;
$$;
revoke all on function public.receive_website_lead(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.receive_website_lead(text,text,jsonb) to service_role;
grant select, insert on public.website_lead_imports to service_role;
