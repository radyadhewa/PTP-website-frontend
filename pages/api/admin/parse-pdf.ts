import type { NextApiRequest, NextApiResponse } from 'next';
import PDFParser from 'pdf2json';
import { ApiError, assertMethod, withApiHandler } from '@/lib/api';
import { getAuthenticatedAdmin } from '@/lib/session';

interface ParsePdfResponse {
  text: string;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

function extractFromBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, true);

    parser.on('pdfParser_dataError', (errMsg: Error | { parserError: Error }) => {
      const err = 'parserError' in errMsg ? errMsg.parserError : errMsg;
      reject(err || new Error('Failed to parse PDF'));
    });

    parser.on('pdfParser_dataReady', (pdfData: { Pages?: Array<{ Texts?: Array<{ R?: Array<{ T?: string }> }> }> }) => {
      let rawText = parser.getRawTextContent() || '';
      rawText = rawText.replace(/----------------Page \(\d+\) Break----------------/g, '\n').trim();

      if (!rawText && pdfData?.Pages) {
        rawText = pdfData.Pages.map((page) =>
          (page.Texts || [])
            .map((item) =>
              (item.R || [])
                .map((r) => {
                  try {
                    return decodeURIComponent(r.T || '');
                  } catch {
                    return r.T || '';
                  }
                })
                .join('')
            )
            .join(' ')
        ).join('\n\n');
      }

      resolve(rawText.trim());
    });

    parser.parseBuffer(buffer);
  });
}

async function parsePdfHandler(
  req: NextApiRequest,
  res: NextApiResponse<ParsePdfResponse>,
): Promise<void> {
  assertMethod(req, res, ['POST']);
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    throw new ApiError(401, 'Unauthorized admin session.');
  }

  const { fileBase64 } = (req.body as { fileBase64?: unknown }) || {};
  if (!fileBase64 || typeof fileBase64 !== 'string') {
    throw new ApiError(400, 'fileBase64 string is required.');
  }

  const base64Data = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
  const buffer = Buffer.from(base64Data, 'base64');
  const text = await extractFromBuffer(buffer);

  if (!text) {
    throw new ApiError(422, 'Could not extract readable text from the provided PDF.');
  }

  res.status(200).json({ text });
}

export default withApiHandler(parsePdfHandler);
