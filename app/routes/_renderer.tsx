import { Style } from "hono/css";
import { jsxRenderer } from "hono/jsx-renderer";
import { Script } from "honox/server";

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <Script src="/app/client.ts" async />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          {`
            /* Light theme vertical scrollbar */
            html, body { height: 100%; }
            body { overflow-y: scroll; }
            /* Firefox */
            * { scrollbar-width: thin; scrollbar-color: #CBD5E1 #F8FAFC; }
            /* WebKit */
            *::-webkit-scrollbar { width: 10px; }
            *::-webkit-scrollbar-track { background: #F8FAFC; }
            *::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 8px; border: 2px solid #F8FAFC; }
            *::-webkit-scrollbar-thumb:hover { background-color: #94A3B8; }
          `}
        </style>
        <Style />
      </head>
      <body class="bg-white">
        <div>{children}</div>
      </body>
    </html>
  );
});
