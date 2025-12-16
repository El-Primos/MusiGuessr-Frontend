import Image from 'next/image';

export default function SettingsButton() {
  return (
    <button className="fixed bottom-4 right-4 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
      <Image 
        src="/setting.png" 
        alt="Settings" 
        width={24} 
        height={24}
      />
    </button>
  );
}