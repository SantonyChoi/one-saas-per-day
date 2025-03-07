import React from "react";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Dropbox Clone - Home" },
    { name: "description", content: "Welcome to Dropbox Clone" },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Dropbox Clone
        </h1>
        <p className="text-gray-600 text-center mb-8">
          A simple file storage application built with Remix and Tailwind CSS.
        </p>
        <div className="flex justify-center">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
} 