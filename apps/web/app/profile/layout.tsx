"use client";

import React from "react";
import { SuperchargedProvider } from "../../components/supercharged/supercharged-context";
import SuperchargedPanel from "../../components/supercharged/supercharged-panel";
import { NotificationProvider } from "../../lib/notification-context";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperchargedProvider>
      <NotificationProvider>
        {children}
        <SuperchargedPanel />
      </NotificationProvider>
    </SuperchargedProvider>
  );
}
