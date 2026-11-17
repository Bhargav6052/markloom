-- Match the registered document to the outer storage object, not its display filename.
ALTER POLICY inkloom_brand_download ON storage.objects
TO authenticated
USING (
  bucket_id = 'inkloom-private'
  AND EXISTS (
    SELECT 1 FROM public.inkloom_documents AS d
    WHERE d.object_path = storage.objects.name
      AND inkloom_private.member_role(d.org_id) IS NOT NULL
  )
);
