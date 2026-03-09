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
import type { LargestTransfer } from "./types";

interface StatsCardsProps {
	largestTransfer: LargestTransfer | null;
}

export function StatsCards({ largestTransfer }: StatsCardsProps) {
	if (!largestTransfer) {
		return null;
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">
						Quién hizo la mayor transferencia
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3">
						<Avatar className="size-10">
							<AvatarImage
								src={largestTransfer.fromPlayer.user?.image || undefined}
								alt={largestTransfer.fromPlayer.name}
							/>
							<AvatarFallback className="bg-blue-500/10 text-blue-600">
								{largestTransfer.fromPlayer.name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div>
							<p className="font-semibold">{largestTransfer.fromPlayer.name}</p>
							<p className="text-sm text-muted-foreground">
								Envió ${largestTransfer.amount.toLocaleString()}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">
						Quién recibió la mayor transferencia
					</CardTitle>
				</CardHeader>
				<CardContent>
					{largestTransfer.toPlayer ? (
						<div className="flex items-center gap-3">
							<Avatar className="size-10">
								<AvatarImage
									src={largestTransfer.toPlayer.user?.image || undefined}
									alt={largestTransfer.toPlayer.name}
								/>
								<AvatarFallback className="bg-green-500/10 text-green-600">
									{largestTransfer.toPlayer.name.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-semibold">{largestTransfer.toPlayer.name}</p>
								<p className="text-sm text-muted-foreground">
									Recibió ${largestTransfer.amount.toLocaleString()}
								</p>
							</div>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">Jugador del sistema</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
