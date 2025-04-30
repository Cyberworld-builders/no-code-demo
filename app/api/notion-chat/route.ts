import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import OpenAI from 'openai';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set');
  throw new Error('OPENAI_API_KEY is not set');
}
if (!process.env.NOTION_API_KEY) {
  console.error('NOTION_API_KEY is not set');
  throw new Error('NOTION_API_KEY is not set');
}
if (!process.env.NOTION_DATABASE_ID) {
  console.error('NOTION_DATABASE_ID is not set');
  throw new Error('NOTION_DATABASE_ID is not set');
}

async function fetchNotionTableData() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
    });

    const rows = response.results.map((row: any) => {
      const properties = row.properties;
      const rowData = Object.entries(properties)
        .map(([key, value]: [string, any]) => {
          let displayValue = '';
          if (value.type === 'title') {
            displayValue = value.title[0]?.plain_text || '';
          } else if (value.type === 'rich_text') {
            displayValue = value.rich_text[0]?.plain_text || '';
          } else if (value.type === 'number') {
            displayValue = value.number?.toString() || '';
          } else if (value.type === 'select') {
            displayValue = value.select?.name || '';
          } else {
            displayValue = JSON.stringify(value);
          }
          return `${key}: ${displayValue}`;
        })
        .join(', ');
      return `Row: ${rowData}`;
    });

    return rows.join('\n');
  } catch (error) {
    console.error('Error fetching Notion table data:', error);
    return 'Error fetching table data.';
  }
}

export async function POST(request: Request) {
  try {
    console.log('Received POST request to /api/notion-chat');
    const body = await request.json();
    console.log('Request body:', body);

    const { message } = body;
    if (!message) {
      console.warn('No message provided in request body');
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const tableData = await fetchNotionTableData();

    const prompt = `
    You are a helpful assistant for CyberWorld, a futuristic tech platform. Respond in a friendly and professional tone using the CyberWorld aesthetic (e.g., use a tech-inspired, minimalistic tone with phrases like "[ Accessing Data... ]" or "[ Response Generated ]").

    Below is the data from a Notion table that you can use to answer questions:

    ${tableData}

    User message: ${message}
    `;

    console.log('Sending prompt to OpenAI:', prompt);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    console.log('OpenAI response:', response);

    return NextResponse.json({ response: `[ Response Generated ] ${response}` });
  } catch (error: unknown) {
    console.error('Error in /api/notion-chat:', error);
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid OpenAI API key' },
          { status: 401 }
        );
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit or quota exceeded for OpenAI API. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.message.includes('503')) {
        return NextResponse.json(
          { error: 'OpenAI API service unavailable' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: `Server error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}