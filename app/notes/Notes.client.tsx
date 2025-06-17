'use client';

import React, { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { fetchNotes, createNote, FetchNotesResponse } from '@/lib/api';
import type { Note } from '../../types/note';
import NoteList from '@/components/NoteList/NoteList';
import NoteModal from '@/components/NoteModal/NoteModal';
import Pagination from '@/components/Pagination/Pagination';
import SearchBox from '@/components/SearchBox/SearchBox';
import css from './Notes.module.css';
import { useDebounce } from 'use-debounce';

const PER_PAGE = Number(process.env.NEXT_PUBLIC_NOTES_PER_PAGE) || 12;

interface NotesClientProps {
  initialData: FetchNotesResponse;
}

const NotesClient = ({ initialData }: NotesClientProps) => {
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
    initialData:
      page === 1 && debouncedSearchTerm === '' ? initialData : undefined,
  });

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsModalOpen(false);
    },
  });

  const handleCreateNote = (note: {
    title: string;
    content?: string;
    tag: Note['tag'];
  }) => {
    createMutation.mutate(note);
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

      {data && data.notes.length > 0 && <NoteList notes={data.notes} />}
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
