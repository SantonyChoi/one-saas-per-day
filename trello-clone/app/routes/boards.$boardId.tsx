import { json, redirect } from '@remix-run/node';
import type { LoaderFunction, ActionFunction } from '@remix-run/node';
import { useLoaderData, Form, useParams, Link } from "@remix-run/react";
import { supabase } from '~/utils/supabase.server';

// 데이터 로드 함수
export const loader: LoaderFunction = async ({ params }) => {
  const boardId = params.boardId!;
  // 해당 보드의 모든 리스트 조회
  const { data: lists, error: listError } = await supabase
    .from('lists')
    .select('*')
    .eq('board_id', boardId);
  if (listError) throw new Response(listError.message, { status: 500 });
  
  // 리스트에 속한 모든 카드 조회
  const listIds = lists.map((l: { id: string }) => l.id);
  const { data: cards, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .in('list_id', listIds);
  if (cardError) throw new Response(cardError.message, { status: 500 });
  
  return json({ lists, cards });
};

// 데이터 생성/수정 액션
export const action: ActionFunction = async ({ request, params }) => {
  const boardId = params.boardId!;
  const formData = await request.formData();
  const listName = formData.get('listName');
  const cardTitle = formData.get('cardTitle');
  const moveCardId = formData.get('moveCardId');
  
  // ① 새 리스트 추가 폼 제출 처리
  if (typeof listName === 'string' && listName.trim().length > 0) {
    const { error } = await supabase.from('lists').insert({ 
      name: listName, board_id: boardId 
    });
    if (error) throw new Response(error.message, { status: 500 });
    return redirect(`/boards/${boardId}`);
  }
  
  // ② 새 카드 추가 폼 제출 처리
  if (typeof cardTitle === 'string' && cardTitle.trim().length > 0) {
    const listId = formData.get('listId');
    if (typeof listId === 'string') {
      const { error } = await supabase.from('cards').insert({ 
        title: cardTitle, list_id: listId 
      });
      if (error) throw new Response(error.message, { status: 500 });
    }
    return redirect(`/boards/${boardId}`);
  }
  
  // ③ 카드 이동 처리
  if (typeof moveCardId === 'string') {
    const targetListId = formData.get('targetListId');
    if (typeof targetListId === 'string') {
      const { error } = await supabase.from('cards')
        .update({ list_id: targetListId })
        .eq('id', moveCardId);
      if (error) throw new Response(error.message, { status: 500 });
    }
    return new Response(null, { status: 204 });
  }
  
  return null;
};

// 보드 상세 페이지 컴포넌트
export default function BoardDetailPage() {
  const { lists, cards } = useLoaderData<typeof loader>();
  const params = useParams();
  const boardId = params.boardId;

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            <Link to="/" className="hover:underline">Trello Clone</Link>
          </h1>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 mr-4">Board Details</h2>
          <Link to="/" className="text-blue-600 hover:underline text-sm">
            ← Back to All Boards
          </Link>
        </div>
        
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {lists.map((list: { id: string; name: string }) => (
            <div 
              key={list.id} 
              className="w-72 bg-gray-100 rounded-md shadow-sm flex flex-col max-h-[calc(100vh-180px)]" 
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const cardId = e.dataTransfer.getData('text/plain');
                const targetListId = list.id;
                if (cardId) {
                  await fetch(`/boards/${boardId}`, {
                    method: "POST",
                    body: new URLSearchParams({ moveCardId: cardId, targetListId: targetListId })
                  });
                  window.location.reload();
                }
              }}
            >
              <div className="p-3 bg-gray-200 rounded-t-md">
                <h3 className="font-semibold text-gray-700">{list.name}</h3>
              </div>
              
              <div className="p-2 flex-grow overflow-y-auto">
                <ul className="space-y-2">
                  {cards
                    .filter((card: { list_id: string }) => card.list_id === list.id)
                    .map((card: { id: string; title: string }) => (
                      <li 
                        key={card.id} 
                        className="bg-white p-3 rounded shadow hover:shadow-md transition-shadow cursor-grab"
                        draggable
                        onDragStart={e => e.dataTransfer.setData('text/plain', card.id)}
                      >
                        {card.title}
                      </li>
                    ))}
                </ul>
              </div>
              
              <div className="p-2 border-t border-gray-200">
                <Form method="post" reloadDocument className="mb-1">
                  <input type="hidden" name="listId" value={list.id} />
                  <input 
                    name="cardTitle" 
                    placeholder="Add new card..." 
                    className="w-full border border-gray-300 rounded p-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                  <button 
                    type="submit" 
                    className="w-full text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    + Add Card
                  </button>
                </Form>
              </div>
            </div>
          ))}
          
          <div className="w-72 bg-gray-100 bg-opacity-80 rounded-md p-3 shadow-sm">
            <Form method="post" reloadDocument>
              <input 
                name="listName" 
                placeholder="Add new list..." 
                className="w-full border border-gray-300 rounded p-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <button 
                type="submit" 
                className="w-full text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded transition-colors"
              >
                + Add List
              </button>
            </Form>
          </div>
        </div>
      </main>
    </div>
  );
} 