import * as React from "react";
import { Link, Form } from "@remix-run/react";
import { supabase } from "../utils/supabase";

interface ChannelSidebarProps {
  channels: any[];
  currentUser?: { id: string; email: string } | null;
}

export default function ChannelSidebar({ channels, currentUser }: ChannelSidebarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="w-1/4 border-r p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Slack Clone</h2>
        {currentUser && (
          <button 
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        )}
      </div>
      
      {currentUser && (
        <div className="mb-4 text-sm text-gray-600">
          <p>Logged in as: {currentUser.email}</p>
        </div>
      )}
      
      <h3 className="font-bold mb-2">Channels</h3>
      <ul className="mb-6">
        {channels.map((ch: any) => (
          <li key={ch.id} className="mb-1">
            <Link to={`/channels/${ch.id}`} className="text-blue-600 hover:underline">
              # {ch.name}
            </Link>
          </li>
        ))}
      </ul>
      
      <Form method="post" reloadDocument className="flex mt-auto">
        <input type="text" name="name" placeholder="New channel name" className="flex-1 border p-1 text-sm" />
        <button type="submit" className="ml-2 bg-gray-200 px-2 text-sm">Create</button>
      </Form>
    </aside>
  );
} 