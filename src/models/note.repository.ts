import { and, eq, ilike } from "drizzle-orm";
import db from "@/lib/db";
import { notes, type INote, type NewNote } from "@/models/schema";

export const noteSortMap = {
  title: notes.title,
  created_at: notes.created_at,
  updated_at: notes.updated_at,
};

export function listNotes(userId: string, search?: string) {
  const conditions = [eq(notes.user_id, userId)];
  if (search) {
    conditions.push(ilike(notes.title, `%${search}%`));
  }

  return db
    .select({
      id: notes.id,
      title: notes.title,
      note: notes.note,
      created_at: notes.created_at,
      updated_at: notes.updated_at,
    })
    .from(notes)
    .where(and(...conditions))
    .$dynamic();
}

export async function createNoteForUser(
  userId: string,
  data: { title: string; note?: string | null },
): Promise<INote> {
  const [row] = await db
    .insert(notes)
    .values({ user_id: userId, title: data.title, note: data.note } as NewNote)
    .returning();
  return row;
}

export async function updateNoteForUser(
  id: number,
  userId: string,
  data: Partial<NewNote>,
): Promise<INote | null> {
  const [row] = await db
    .update(notes)
    .set(data)
    .where(and(eq(notes.id, id), eq(notes.user_id, userId)))
    .returning();
  return row ?? null;
}

export async function deleteNoteForUser(
  id: number,
  userId: string,
): Promise<INote | null> {
  const [row] = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.user_id, userId)))
    .returning();
  return row ?? null;
}
