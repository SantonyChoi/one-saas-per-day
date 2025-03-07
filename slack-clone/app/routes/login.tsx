// app/routes/login.tsx (예시)
import { ActionFunction, json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { supabase } from "../../utils/supabase";

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    // Supabase로 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return json({ error: error.message }, { status: 400 });
    }
    // 성공 시 홈페이지나 채널 목록으로 리다이렉트
    return redirect("/channels");
};

export default function Login() {
    const actionData = useActionData<typeof action>();
    return (
        <div className="max-w-sm mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">로그인</h1>
            <Form method="post" className="flex flex-col space-y-3">
                <input type="email" name="email" placeholder="Email" required className="p-2 border" />
                <input type="password" name="password" placeholder="Password" required className="p-2 border" />
                {actionData?.error && <p className="text-red-500">{actionData.error}</p>}
                <button type="submit" className="bg-blue-600 text-white py-2">이메일로 로그인</button>
            </Form>
            <hr className="my-4" />
            <button
                onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
                className="bg-gray-100 border py-2 w-full"
            >
                Google 계정으로 계속하기
            </button>
        </div>
    );
}
