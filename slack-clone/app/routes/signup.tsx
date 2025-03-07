import * as React from "react";
import { ActionFunction, json, redirect } from "@remix-run/node";
import { Form, useActionData, Link } from "@remix-run/react";
import { supabase } from "../utils/supabase";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  if (!email || !password) {
    return json({ error: "Please enter both email and password." }, { status: 400 });
  }
  
  // Attempt to sign up with Supabase
  const { data, error } = await supabase.auth.signUp({ email, password });
  
  if (error) {
    return json({ error: error.message }, { status: 400 });
  }
  
  // Redirect to login page on success
  return redirect("/login?message=Registration complete. Please check your email.");
};

export default function Signup() {
  const actionData = useActionData<typeof action>();
  
  return (
    <div className="max-w-sm mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <Form method="post" className="flex flex-col space-y-3">
        <input type="email" name="email" placeholder="Email" required className="p-2 border" />
        <input type="password" name="password" placeholder="Password" required className="p-2 border" />
        {actionData?.error && <p className="text-red-500">{actionData.error}</p>}
        <button type="submit" className="bg-blue-600 text-white py-2">Sign Up</button>
      </Form>
      <hr className="my-4" />
      <p className="text-center text-sm">
        Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
      </p>
    </div>
  );
} 