export interface IUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    socialLinks: string[];
    comparePassword(password: string): Promise<boolean | undefined>;
}