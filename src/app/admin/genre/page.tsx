'use client';

import GenrePanel from '@/components/AdminOps/GenrePanel';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function GenrePanelPage() {
  return (
    <div className="p-8">
      <GenrePanel apiBase={API_BASE} />
    </div>
  );
}
//       {/** 
//        * We may add that to header?
//         rightContent={
//           hasUser ? (
//             <div className="flex items-center gap-2 mr-2 md:mr-4">
//               <button
//                 onClick={() => router.push("/profile")}
//                 className="px-2 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 md:gap-2 transition-colors"
//                 title="View Profile"
//               >
//                 <svg
//                   className="w-5 h-5"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                   />
//                 </svg>
//                 <span className="hidden sm:inline">Profile</span>
//               </button>
//             </div>
//           ) : null
          
//       }
//       **/

//       <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-10 flex justify-center">
//         <GenrePanel apiBase={API_BASE} />

//       </div>
//     </div>
//   );
// } 
// **/}