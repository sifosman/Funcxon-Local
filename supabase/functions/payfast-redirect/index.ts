Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'success';

  const redirectTo = type === 'cancel'
    ? 'funxon://payment/cancel'
    : 'funxon://payment/success';

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
    },
  });
});
