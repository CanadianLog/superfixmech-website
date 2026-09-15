"use client";

import { useEffect, useRef } from "react";

const WIDGET_SRC =
  "https://www.cdnstyles.com/static/custom_form_widget/v1/custom_form.widget.js";

function CrmWidgetSlot({ data }: { data: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = WIDGET_SRC;
    script.setAttribute("data-crm-form-widget", "");
    script.setAttribute("data", data);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [data]);

  return <div ref={containerRef} className="flex justify-center" />;
}

/**
 * Renders the CRM-hosted contact/booking form widget, swapping the config
 * (size, colors, form id) between desktop and mobile breakpoints via CSS
 * so each viewport loads the widget sized for it.
 */
export function CrmFormWidget({
  desktopData,
  mobileData,
}: {
  desktopData: string;
  mobileData: string;
}) {
  return (
    <div className="w-full">
      <div className="hidden md:flex md:justify-center">
        <CrmWidgetSlot data={desktopData} />
      </div>
      <div className="flex justify-center md:hidden">
        <CrmWidgetSlot data={mobileData} />
      </div>
    </div>
  );
}
