
export type Artist = { 
    id: number; 
    name: string; 
    message?: string 
};

export type Genre = { 
    id: number; 
    name: string; 
    message?: string 
};

export type AuthRes = {
  message: string;
  id: number;
  username: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

export type StoredUser = {
  id: number;
  username: string;
  email: string;
};


export type MusicItem = {
  id: number;
  name: string;
  url: string;
  genre: Genre;
  artist: Artist;
};



export type UploadConfirmReq = {
  name: string;
  genreId: number;
  artistId: number;
  key: string;
};

export type UploadConfirmRes = {
  message: string;
  id: number;
  name: string;
  url: string;
};
