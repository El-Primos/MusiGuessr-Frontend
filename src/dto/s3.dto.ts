export type UploadUrlReq = {
  name: string;
  fileName: string;
  contentType: string;
};

export type UploadUrlRes = {
  message: string;
  key: string;
  uploadUrl: string;
};

export type S3UploadInput = {
  name: string;
  file: File;
};

export type S3UploadResult = {
  key: string;
  uploadUrl: string;
};
