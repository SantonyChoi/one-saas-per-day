// app/routes/login.tsx
import * as React from "react";
import { ActionFunction, json, redirect } from "@remix-run/node";
import { Form, useActionData, Link, useSearchParams } from "@remix-run/react";
import { supabase } from "../../utils/supabase";

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    // Attempt to login with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return json({ error: error.message }, { status: 400 });
    }
    // Redirect to homepage or channel list on success
    return redirect("/channels");
};

export default function Login() {
    const actionData = useActionData<typeof action>();
    const [searchParams] = useSearchParams();
    const message = searchParams.get("message");
    
    return (
        <div className="max-w-sm mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Login</h1>
            {message && <p className="text-green-500 mb-4">{message}</p>}
            <Form method="post" className="flex flex-col space-y-3">
                <input type="email" name="email" placeholder="Email" required className="p-2 border" />
                <input type="password" name="password" placeholder="Password" required className="p-2 border" />
                {actionData?.error && <p className="text-red-500">{actionData.error}</p>}
                <button type="submit" className="bg-blue-600 text-white py-2">Login with Email</button>
            </Form>
            <hr className="my-4" />
            <button
                onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
                className="bg-gray-100 border py-2 w-full"
            >
                Continue with Google
            </button>
            <p className="text-center text-sm mt-4">
                Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Sign Up</Link>
            </p>
        </div>
    );
}
