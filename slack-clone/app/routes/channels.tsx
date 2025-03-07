// app/routes/channels.tsx (Channel list and creation form)
import * as React from "react";
import { LoaderFunction, ActionFunction, json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { supabase } from "../utils/supabase";
import ChannelSidebar from "../components/ChannelSidebar";

export const loader: LoaderFunction = async ({ request }) => {
  // Get current logged-in user information
  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirect to login page if not logged in
  if (!user) {
    return redirect("/login");
  }
  
  // Get all channels from Supabase
  const { data: channels, error } = await supabase.from("channels").select("*").order("created_at");
  if (error) throw new Response(error.message, { status: 500 });
  
  return json({ 
    channels, 
    currentUser: {
      id: user.id,
      email: user.email
    }
  });
};

export const action: ActionFunction = async ({ request }) => {
  // Get current logged-in user information
  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirect to login page if not logged in
  if (!user) {
    return redirect("/login");
  }
  
  const formData = await request.formData();
  const name = formData.get("name") as string;
  if (!name) {
    return json({ error: "Please enter a channel name." }, { status: 400 });
  }
  // Insert new channel into DB
  const { error } = await supabase.from("channels").insert({ 
    name,
    created_by: user.id
  });
  if (error) throw new Response(error.message, { status: 500 });
  return redirect("/channels");  // Redirect to channel list after creation
};

export default function ChannelsPage() {
  const { channels, currentUser } = useLoaderData<typeof loader>();
  
  return (
    <div className="flex h-screen">
      {/* Left channel list area */}
      <ChannelSidebar channels={channels} currentUser={currentUser} />
      
      {/* Right chat area: basic guidance or channel selection request */}
      <main className="flex-1 p-4">
        <p className="text-gray-500">Please select a channel.</p>
      </main>
    </div>
  );
} 