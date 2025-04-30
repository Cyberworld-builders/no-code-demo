import NotionChatWidget from '../components/NotionChatWidget';

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold uppercase mb-8">CyberWorld Notion Chatbot</h1>
      <p className="text-lg mb-8 text-[#00ff00]/70">
        Ask questions about projects stored in the Notion table.
      </p>
      <NotionChatWidget />
    </div>
  );
}