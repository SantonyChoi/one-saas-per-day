import * as React from "react";
import { LoaderFunction, redirect } from "@remix-run/node";

export const loader: LoaderFunction = async () => {
  // 홈페이지 접속 시 채널 목록 페이지로 리다이렉트
  return redirect("/channels");
};

export default function Index() {
  return (
    <div>
      <p>리다이렉트 중...</p>
    </div>
  );
} 