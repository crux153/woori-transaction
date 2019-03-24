export interface WooriResult {
	name: string;
	account: string;
	branch: string;
	balance: number;
	withdrawable: number;
	pages: number;
	transactions: WooriTransaction[];
}

export interface WooriTransaction {
	timestamp: string;
	type: string;
	branch: string;
	name: string;
	withdrawal: number;
	deposit: number;
	balance: number;
}

export default function woori(account: string, password: string, birthday: string, range?: string): Promise<WooriResult>;
