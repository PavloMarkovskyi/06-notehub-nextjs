import axios from 'axios';
import type { Note } from '../types/note';

const BASE_URL = 'https://notehub-public.goit.study/api';
const token = process.env.NEXT_PUBLIC_NOTEHUB_TOKEN;

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export interface FetchNotesParams {
  page: number;
  perPage: number;
  search?: string;
}

export interface FetchNotesResponse {
  notes: Note[];
  totalPages: number;
}

export interface NewNotePayload {
  title: string;
  content?: string;
  tag: Note['tag'];
}

export const fetchNotes = async ({
  page,
  perPage,
  search,
}: FetchNotesParams): Promise<FetchNotesResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });

  if (search?.trim()) {
    params.append('search', search.trim());
  }

  const response = await axios.get<FetchNotesResponse>(
    `${BASE_URL}/notes?${params.toString()}`,
    getAuthHeaders()
  );

  return response.data;
};

export const createNote = async (
  note: NewNotePayload
): Promise<Note> => {
  const response = await axios.post<Note>(
    `${BASE_URL}/notes`,
    note,
    getAuthHeaders()
  );
  return response.data;
};

export const deleteNote = async (
  id: number
): Promise<{ message: string }> => {
  const response = await axios.delete<{ message: string }>(
    `${BASE_URL}/notes/${id}`,
    getAuthHeaders()
  );
  return response.data;
};
export const fetchNoteById = async (id: number): Promise<Note> => {
  const { data } = await axios.get(`${BASE_URL}/notes/${id}`, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_NOTEHUB_TOKEN}`,
    },
  });
  return data;
};