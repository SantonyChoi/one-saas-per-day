import { json, redirect } from '@remix-run/node';
import type { LoaderFunction, ActionFunction } from '@remix-run/node';
import { useLoaderData, Form, useParams } from "@remix-run/react";
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
    <main className="p-4">
      <h2 className="text-lg font-bold mb-4">Board Details</h2>
      <div className="flex space-x-4 overflow-x-auto">
        {lists.map((list: { id: string; name: string }) => (
          <div 
            key={list.id} 
            className="w-64 bg-gray-100 p-3 rounded" 
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              const cardId = e.dataTransfer.getData('text/plain');
              const targetListId = list.id;
              if (cardId) {
                // 드롭된 카드의 list_id 업데이트 요청
                await fetch(`/boards/${boardId}`, {
                  method: "POST",
                  body: new URLSearchParams({ moveCardId: cardId, targetListId: targetListId })
                });
                window.location.reload();
              }
            }}
          >
            <h3 className="font-semibold mb-2">{list.name}</h3>
            <ul className="mb-2">
              {cards
                .filter((card: { list_id: string }) => card.list_id === list.id)
                .map((card: { id: string; title: string }) => (
                  <li key={card.id} className="bg-white p-2 mb-1 rounded shadow"
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', card.id)}>
                    {card.title}
                  </li>
                ))}
            </ul>
            {/* 카드 추가 폼 (해당 리스트에 추가) */}
            <Form method="post" reloadDocument className="mb-4">
              <input type="hidden" name="listId" value={list.id} />
              <input name="cardTitle" placeholder="New card" className="border p-1 text-sm" />
              <button type="submit" className="text-sm bg-blue-500 text-white px-2 py-1">+ Add Card</button>
            </Form>
          </div>
        ))}
        {/* 리스트 추가 폼 */}
        <Form method="post" reloadDocument className="w-64">
          <input name="listName" placeholder="New list name" className="border p-1 text-sm mr-1" />
          <button type="submit" className="text-sm bg-green-500 text-white px-2 py-1">+ Add List</button>
        </Form>
      </div>
    </main>
  );
} 