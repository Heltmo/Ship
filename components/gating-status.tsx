"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type GatingStatus } from "@/lib/validations/profile";
import { CheckCircle2, XCircle } from "lucide-react";

interface GatingStatusProps {
  status: GatingStatus;
}

export function GatingStatusCard({ status }: GatingStatusProps) {
  return (
    <Card
      className={
        status.isEligible
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-orange-500/30 bg-orange-500/10"
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Discovery Visibility</CardTitle>
          {status.isEligible ? (
            <Badge variant="default" className="bg-emerald-500/20 text-emerald-200">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Eligible
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-200">
              <XCircle className="mr-1 h-3 w-3" />
              Locked
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {status.isEligible ? (
          <p className="text-sm text-emerald-200">
            You are visible in the People feed and can be discovered by others.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-orange-200 font-medium">
              Complete these to appear in the People feed:
            </p>
            <ul className="text-sm text-orange-200/80 space-y-1">
              {status.missingRequirements.map((req, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">-</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
