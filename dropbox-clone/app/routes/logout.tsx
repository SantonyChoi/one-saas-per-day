import { supabase } from "../utils/supabase.server";
import { ActionFunction, redirect } from "@remix-run/node";

export const action: ActionFunction = async () => {
  await supabase.auth.signOut();
  return redirect("/");
};

export const loader = () => {
  return redirect("/");
}; 