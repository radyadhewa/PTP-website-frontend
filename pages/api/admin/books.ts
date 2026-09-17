import type { NextApiRequest, NextApiResponse } from 'next';
import type { CuratedBook } from '@/types/domain';
import { ApiError, assertMethod, withApiHandler } from '@/lib/api';
import { addCuratedBook, deleteCuratedBook, getCuratedBooks } from '@/lib/dataStore';
import { getAuthenticatedAdmin } from '@/lib/session';
import { parseCuratedBookInput } from '@/lib/validation';

async function adminBooksHandler(
  req: NextApiRequest,
  res: NextApiResponse<CuratedBook[] | CuratedBook | { ok: boolean }>,
): Promise<void> {
  assertMethod(req, res, ['GET', 'POST', 'DELETE']);
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    throw new ApiError(401, 'Unauthorized admin session.');
  }

  if (req.method === 'GET') {
    const books = await getCuratedBooks();
    res.status(200).json(books);
    return;
  }

  if (req.method === 'POST') {
    const bookInput = parseCuratedBookInput(req.body as unknown);
    const newBook = await addCuratedBook(bookInput);
    res.status(201).json(newBook);
    return;
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string | undefined;
    if (!id || typeof id !== 'string') {
      throw new ApiError(400, 'Book ID query parameter is required.');
    }
    const success = await deleteCuratedBook(id);
    if (!success) {
      throw new ApiError(404, 'Curated book not found.');
    }
    res.status(200).json({ ok: true });
    return;
  }
}

export default withApiHandler(adminBooksHandler);
