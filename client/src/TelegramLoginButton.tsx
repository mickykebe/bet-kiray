import React, { useRef, useEffect } from "react";

declare global {
  interface Window {
    TelegramLoginWidget: any;
  }
}

window.TelegramLoginWidget = window.TelegramLoginWidget || {};

export default function TelegramLoginButton({
  botName,
  size = "large",
  dataOnauth
}: {
  botName: string;
  size?: string;
  dataOnauth: (user: any) => void;
}) {
  const containerEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    window.TelegramLoginWidget = {
      dataOnauth: (user: any) => dataOnauth(user)
    };
    script.src = "https://telegram.org/js/telegram-widget.js?4";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", size);
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "TelegramLoginWidget.dataOnauth(user)");
    script.async = true;
    if (containerEl.current) {
      containerEl.current.appendChild(script);
    }
  }, [botName, size, dataOnauth]);

  return <div ref={containerEl}></div>;
}
