import { supabase } from "../utils/supabase.server";
import { ActionFunction, json, redirect } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const { error } = await supabase.auth.signIn({ email, password });
    if (error) {
      return json({ error: error.message }, { status: 400 });
    }
    return redirect("/app");
  };
  