"use client";

import ManageBooking from "@/components/booking/ManageBooking";
import SiteFrame from "@/components/site/SiteFrame";
import { useParams } from "next/navigation";

export default function Page() {
  const token = String(useParams().token || "");
  return (
    <SiteFrame>
      <ManageBooking token={token} />
    </SiteFrame>
  );
}
