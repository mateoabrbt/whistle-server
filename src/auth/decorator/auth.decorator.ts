import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'Public';
export const Public = () => SetMetadata(IS_PUBLIC, true);
