// app/routes/_index.tsx - 보드 목록 페이지
import { json, redirect } from '@remix-run/node';
import type { LoaderFunction, ActionFunction } from '@remix-run/node';
import { useLoaderData, Link, Form } from "@remix-run/react";
import { supabase } from '~/utils/supabase.server';

// 데이터 로드 함수
export const loader: LoaderFunction = async () => {
  const { data: boards, error } = await supabase.from('boards').select('*');
  if (error) throw new Response(error.message, { status: 500 });
  return json({ boards });
};

// 데이터 생성 액션
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const title = formData.get('title');
  if (typeof title === 'string' && title.trim().length > 0) {
    const { error } = await supabase.from('boards').insert({ title });
    if (error) throw new Response(error.message, { status: 500 });
  }
  return redirect('/');
};

// 보드 목록 페이지 컴포넌트
export default function BoardsPage() {
  const { boards } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Trello 클론</h1>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6">내 보드</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {boards.map((board: { id: string; title: string }) => (
            <Link 
              key={board.id} 
              to={`/boards/${board.id}`}
              className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-4 rounded-md shadow-sm hover:shadow-md transition-shadow h-32 flex items-center justify-center"
            >
              <h3 className="text-lg font-semibold">{board.title}</h3>
            </Link>
          ))}
          
          <div className="border-2 border-dashed border-gray-300 rounded-md h-32 flex items-center justify-center p-4">
            <Form method="post" reloadDocument className="w-full">
              <input 
                type="text" 
                name="title" 
                placeholder="새 보드 이름..." 
                className="w-full border border-gray-300 rounded p-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors"
              >
                보드 생성
              </button>
            </Form>
          </div>
        </div>
      </main>
      
      <footer className="container mx-auto p-4 text-center text-gray-500 text-sm">
        <p>Trello 클론 - Remix + Supabase로 구현</p>
      </footer>
    </div>
  );
}
