import { useEffect, useState, useRef } from 'react';
import { RotateCcw, Upload, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { settingsService } from '@/services/settingsService';
import type { UserSettings } from '@/types';

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [autoZoom, setAutoZoom] = useState(false);
  const [defaultZoomLevel, setDefaultZoomLevel] = useState(2);
  const [defaultZoomDuration, setDefaultZoomDuration] = useState(1);
  const [bunnyEncoding, setBunnyEncoding] = useState(false);
  const [brandColor, setBrandColor] = useState('#000000');
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getUserSettings();
      applySettings(data);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const applySettings = (data: UserSettings) => {
    setAutoZoom(data.auto_zoom);
    setDefaultZoomLevel(data.default_zoom_level);
    setDefaultZoomDuration(data.default_zoom_duration);
    setBunnyEncoding(data.bunny_encoding);
    setBrandColor(data.brand_color || '#000000');
    setOrganizationLogo(data.organization_logo || null);
    setLogoPreview(null);
    setLogoFile(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    try {
      await settingsService.removeLogo();
      setOrganizationLogo(null);
      setLogoPreview(null);
      setLogoFile(null);
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove logo');
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      const data = await settingsService.resetUserSettings();
      applySettings(data);
      toast.success('Settings reset to defaults');
    } catch {
      toast.error('Failed to reset settings');
    } finally {
      setResetting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (logoFile) {
        const { url } = await settingsService.uploadLogo(logoFile);
        setOrganizationLogo(url);
        setLogoFile(null);
        setLogoPreview(null);
      }

      const updated = await settingsService.updateUserSettings({
        auto_zoom: autoZoom,
        default_zoom_level: defaultZoomLevel,
        default_zoom_duration: defaultZoomDuration,
        bunny_encoding: bunnyEncoding,
        brand_color: brandColor,
      });
      applySettings(updated);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <div className="max-w-2xl space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const displayLogo = logoPreview || organizationLogo;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your recording and playback preferences.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Zoom Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zoom Settings</CardTitle>
            <CardDescription>
              Configure auto-zoom behaviour for your recordings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-zoom</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically zoom into click areas during playback.
                </p>
              </div>
              <Switch checked={autoZoom} onCheckedChange={setAutoZoom} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Default Zoom Level</Label>
                <span className="text-sm text-muted-foreground">
                  {defaultZoomLevel}x
                </span>
              </div>
              <Slider
                min={1.5}
                max={4}
                step={0.5}
                value={[defaultZoomLevel]}
                onValueChange={(v) => setDefaultZoomLevel(Array.isArray(v) ? v[0] : v)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Default Zoom Duration</Label>
                <span className="text-sm text-muted-foreground">
                  {defaultZoomDuration}s
                </span>
              </div>
              <Slider
                min={0.5}
                max={3}
                step={0.5}
                value={[defaultZoomDuration]}
                onValueChange={(v) => setDefaultZoomDuration(Array.isArray(v) ? v[0] : v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Encoding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Encoding</CardTitle>
            <CardDescription>
              Video encoding and processing options.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bunny Encoding</Label>
                <p className="text-xs text-muted-foreground">
                  Use Bunny CDN for video encoding and delivery.
                </p>
              </div>
              <Switch checked={bunnyEncoding} onCheckedChange={setBunnyEncoding} />
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding</CardTitle>
            <CardDescription>
              Customise the appearance of your shared videos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="brand-color">Brand Color</Label>
              <div className="flex items-center gap-3">
                <div
                  className="size-8 shrink-0 rounded border"
                  style={{ backgroundColor: brandColor }}
                />
                <Input
                  id="brand-color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#000000"
                  className="max-w-40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Organization Logo</Label>
              <div className="flex items-center gap-4">
                {displayLogo ? (
                  <img
                    src={displayLogo}
                    alt="Organization logo"
                    className="h-12 w-auto rounded border object-contain"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded border bg-muted">
                    <Settings className="size-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 size-4" />
                    Upload
                  </Button>
                  {(organizationLogo || logoPreview) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={handleRemoveLogo}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetting}
          >
            <RotateCcw className="mr-2 size-4" />
            {resetting ? 'Resetting...' : 'Reset to Defaults'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
