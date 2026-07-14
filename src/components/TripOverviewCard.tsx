import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

interface TripOverviewCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const TripOverviewCard = ({
  title,
  description,
  children,
}: TripOverviewCardProps) => {
  return (
    <Card className="w-full md:max-w-125 z-9999 flex-[0.3] rounded-none md:min-h-screen">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea>{children}</ScrollArea>
      </CardContent>
    </Card>
  );
};
