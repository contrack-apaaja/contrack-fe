"use client";

// Di masa depan, di sinilah Anda akan menambahkan:
// import { useState, useEffect } from "react";
// import { Card, CardContent, ... } from "@/components/ui/card";

export function ClauseTable() {
  // Semua state (useState) dan efek (useEffect) untuk fetching data,
  // paginasi, dan search akan berada di sini.

  // Untuk saat ini, kita tampilkan pesan placeholder.
  return (
    <div className="border border-gray-300 rounded-xl bg-white shadow-sm p-6">
      <p className="text-gray-600">No clauses found. Create a new one to get started.</p>
    </div>
  );
}