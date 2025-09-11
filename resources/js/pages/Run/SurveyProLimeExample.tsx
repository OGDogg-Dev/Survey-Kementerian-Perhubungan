import { Head } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SurveyProLimeExample() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Head title="Lime Theme Example" />
      <Card className="card-accent">
        <CardHeader>
          <CardTitle>Contoh Tema Lime</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Komponen mengikuti warna hijau (Fruity) dari tema Lime. Tombol primer dan badge akan otomatis menyesuaikan.
          </p>
          <Button>Button Primer</Button>
        </CardContent>
      </Card>
    </div>
  );
}

