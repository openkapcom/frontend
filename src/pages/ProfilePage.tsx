import { useEffect, useState, useRef } from 'react';
import { Camera, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { profileService } from '@/services/profileService';
import { useAuthStore } from '@/stores/authStore';
import type { User as UserType } from '@/types';

export default function ProfilePage() {
  const { fetchUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      setName(data.name);
      setBio(data.bio || '');
      setWebsite(data.website || '');
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = async () => {
    try {
      await profileService.deleteAvatar();
      setAvatarPreview(null);
      setAvatarFile(null);
      if (profile) {
        setProfile({ ...profile, avatar: undefined });
      }
      fetchUser();
      toast.success('Avatar deleted');
    } catch {
      toast.error('Failed to delete avatar');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('website', website);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      const updated = await profileService.updateProfile(formData);
      setProfile(updated);
      setAvatarFile(null);
      setAvatarPreview(null);
      fetchUser();
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <Card className="max-w-2xl">
          <CardHeader>
            <Skeleton className="size-20 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayAvatar = avatarPreview || profile?.avatar;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your public profile information.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Avatar</CardTitle>
          <CardDescription>Your profile picture visible to others.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="size-20">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="text-lg">
                {name?.charAt(0) || <User className="size-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 size-4" />
                Upload
              </Button>
              {(profile?.avatar || avatarPreview) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={handleDeleteAvatar}
                >
                  <Trash2 className="mr-2 size-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Information</CardTitle>
          <CardDescription>Update your profile details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={profile?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-website">Website</Label>
            <Input
              id="profile-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
