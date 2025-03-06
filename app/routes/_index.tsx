// app/routes/index.tsx (요약)
import { json } from '@remix-run/node';
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
  return new Response("", { status: 302, headers: { Location: "/" } });
};

// 보드 목록 페이지 컴포넌트
export default function BoardsPage() {
  const { boards } = useLoaderData<typeof loader>();
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Boards</h1>
      <ul className="mb-6">
        {boards.map((board: { id: string; title: string }) => (
          <li key={board.id}>
            <Link to={`/boards/${board.id}`} className="text-blue-600 underline">
              {board.title}
            </Link>
          </li>
        ))}
      </ul>
      {/* 새 보드 생성 폼 */}
      <Form method="post" reloadDocument>
        <input type="text" name="title" placeholder="New board name" className="border p-1 mr-2" />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1">Create Board</button>
      </Form>
    </main>
  );
}
