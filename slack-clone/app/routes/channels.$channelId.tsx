import * as React from "react";
import { LoaderFunction, ActionFunction, json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import ChannelSidebar from "../components/ChannelSidebar";

export const loader: LoaderFunction = async ({ params, request }) => {
  const channelId = params.channelId;
  
  // Get current logged-in user information
  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirect to login page if not logged in
  if (!user) {
    return redirect("/login");
  }
  
  // Check if channel exists (optional)
  const { data: channel } = await supabase.from("channels").select("*").eq("id", channelId).single();
  if (!channel) {
    throw new Response("Channel not found", { status: 404 });
  }
  
  // Get all channel list (for sidebar)
  const { data: channels } = await supabase.from("channels").select("*").order("created_at");
  
  // Load recent messages for this channel (e.g., latest 50)
  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, content, user_id, created_at")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw new Response(error.message, { status: 500 });
  
  return json({ 
    channelName: channel.name, 
    messages, 
    channelId,
    channels,
    currentUser: {
      id: user.id,
      email: user.email
    }
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  const channelId = params.channelId!;
  
  // Get current logged-in user information
  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirect to login page if not logged in
  if (!user) {
    return redirect("/login");
  }
  
  const formData = await request.formData();
  const content = formData.get("content") as string;
  if (!content) {
    return json({ error: "Please enter a message." }, { status: 400 });
  }
  
  // Add message to DB
  const { error } = await supabase.from("messages").insert({ 
    content, 
    channel_id: channelId, 
    user_id: user.id 
  });
  if (error) throw new Response(error.message, { status: 500 });
  return null;  // Automatic loader rerun (using useRevalidator) or separate handling
};

export default function ChannelChat() {
  const { channelName, messages: serverMessages, channelId, channels, currentUser } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [messages, setMessages] = useState(serverMessages || []);

  // Set up Supabase Realtime subscription (receive new messages for this channel)
  useEffect(() => {
    const channel = supabase
      .channel(`public:messages_channel_${channelId}`)  // Name to distinguish the channel
      .on(
        "postgres_changes", 
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        payload => {
          const newMessage = payload.new;
          setMessages((prev: any[]) => [...prev, newMessage]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  // Sync latest messages after sending via loader revalidation
  useEffect(() => {
    if (revalidator.state === "idle") {
      // Update local state when serverMessages is refreshed by recent loader call
      setMessages(serverMessages);
    }
  }, [serverMessages, revalidator.state]);

  return (
    <div className="flex h-screen">
      {/* Left channel list area - reuse channel list component */}
      <ChannelSidebar channels={channels} currentUser={currentUser} />
      
      {/* Right chat area */}
      <main className="flex-1 flex flex-col">
        <header className="border-b p-4 font-bold"># {channelName}</header>
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">No messages yet. Send the first message!</p>
          ) : (
            messages.map((msg: any) => (
              <div key={msg.id} className={`mb-2 p-2 rounded ${msg.user_id === currentUser.id ? 'bg-blue-50 ml-auto max-w-[80%]' : 'bg-white max-w-[80%]'}`}>
                {/* User display and message content */}
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600 mr-2">
                    {msg.user_id === currentUser.id ? 'Me' : (msg.user_id?.slice(0, 5) || 'Anon')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className="block">{msg.content}</span>
              </div>
            ))
          )}
        </div>
        <Form method="post" reloadDocument replace className="border-t p-4">
          <input type="text" name="content" placeholder="Type a message..." className="w-full border p-2" autoFocus />
        </Form>
      </main>
    </div>
  );
} 