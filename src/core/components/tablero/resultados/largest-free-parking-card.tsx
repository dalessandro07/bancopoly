import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/src/core/components/ui/avatar";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/src/core/components/ui/card";
import { formatDate } from "@/src/core/components/tablero/slug/transaction-history/utils";
import { CarIcon, ClockIcon } from "lucide-react";
import type { LargestFreeParkingTransfer } from "./types";

interface LargestFreeParkingCardProps {
	largestFreeParkingTransfer: LargestFreeParkingTransfer | null;
}

export function LargestFreeParkingCard({
	largestFreeParkingTransfer,
}: LargestFreeParkingCardProps) {
	if (!largestFreeParkingTransfer) {
		return (
			<Card className="border-dashed">
				<CardContent className="py-6">
					<div className="text-center text-muted-foreground">
						<CarIcon className="size-8 mx-auto mb-2 opacity-50" />
						<p className="text-sm">No hubo transferencias desde Parada Libre</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-2 border-emerald-500/20 bg-linear-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
			<CardHeader className="relative z-10">
				<div className="flex items-center gap-2">
					<CarIcon className="size-5 text-emerald-600" />
					<CardTitle className="text-lg bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
						Mayor transferencia desde Parada Libre
					</CardTitle>
				</div>
			</CardHeader>

			<CardContent className="relative z-10 space-y-4">
				<div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50">
					<span className="text-sm font-medium text-muted-foreground">De</span>
					<span className="font-bold">Parada Libre</span>
				</div>

				<div className="text-center space-y-2">
					<p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
						${largestFreeParkingTransfer.amount.toLocaleString()}
					</p>
					{largestFreeParkingTransfer.createdAt && (
						<div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
							<ClockIcon className="size-3.5" />
							<span>{formatDate(largestFreeParkingTransfer.createdAt)}</span>
						</div>
					)}
				</div>

				<div className="flex items-center gap-3 p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50">
					<Avatar className="size-12 border-2 border-green-500">
						<AvatarImage
							src={largestFreeParkingTransfer.toPlayer.user?.image || undefined}
							alt={largestFreeParkingTransfer.toPlayer.name}
						/>
						<AvatarFallback className="bg-green-500/10 text-green-600 font-semibold">
							{largestFreeParkingTransfer.toPlayer.name.charAt(0).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1">
						<p className="text-xs text-muted-foreground font-medium">Para</p>
						<p className="font-bold text-lg">
							{largestFreeParkingTransfer.toPlayer.name}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
