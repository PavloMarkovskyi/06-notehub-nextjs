'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { fetchNotes, createNote, deleteNote } from '@/lib/api';
import type { Note } from '../../types/note';
import NoteList from '@/components/NoteList/NoteList';
import NoteModal from '@/components/NoteModal/NoteModal';
// import Pagination from '@/components/Pagination/Pagination';
import SearchBox from '@/components/SearchBox/SearchBox';
import css from './Notes.module.css';
import { useDebounce } from 'use-debounce';
import dynamic from 'next/dynamic';

const Pagination = dynamic(() => import('@/components/Pagination/Pagination'), {
  ssr: false,
});

const PER_PAGE = Number(process.env.NEXT_PUBLIC_NOTES_PER_PAGE) || 12;

const NotesClient = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['notes', debouncedSearchTerm, page],
    queryFn: () =>
      fetchNotes({ page, perPage: PER_PAGE, search: debouncedSearchTerm }),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const handleCreateNote = (note: {
    title: string;
    content?: string;
    tag: Note['tag'];
  }) => {
    createMutation.mutate(note);
  };

  const handleDeleteNote = (id: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const totalPages = data?.totalPages || 1;

  return (
    <div className={css.app}>
      <header className={css.toolbar}>
        <SearchBox value={searchTerm} onChange={handleSearchChange} />
        {totalPages > 1 && (
          <Pagination
            pageCount={totalPages}
            currentPage={page}
            onPageChange={(selectedPage: number) => setPage(selectedPage)}
          />
        )}
        <button className={css.button} onClick={() => setIsModalOpen(true)}>
          Create note +
        </button>
      </header>

      {isLoading && <p>Loading notes...</p>}
      {isError && <p>Error: {(error as Error).message}</p>}

      {data && data.notes.length > 0 && (
        <NoteList notes={data.notes} onDeleteNote={handleDeleteNote} />
      )}
      {data && data.notes.length === 0 && (
        <p className={css.empty}>No notes found. Try adjusting your search.</p>
      )}

      {isModalOpen && (
        <NoteModal
          onClose={() => setIsModalOpen(false)}
          onCreateNote={handleCreateNote}
        />
      )}
    </div>
  );
};

export default NotesClient;
