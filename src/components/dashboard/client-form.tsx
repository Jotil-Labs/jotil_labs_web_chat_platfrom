'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type {
  Client,
  ClientCreateInput,
  ClientCustomization,
  Plan,
  Position,
  DarkMode,
  WidgetSize,
} from '@/types';

interface ModelOption {
  id: string;
  displayName: string;
}

interface ClientFormProps {
  client?: Client;
  models: ModelOption[];
  onSubmit: (data: ClientCreateInput) => Promise<void>;
}

const planLimits: Record<Plan, number> = {
  starter: 2000,
  pro: 10000,
  agency: 50000,
  enterprise: 200000,
};

export function ClientForm({ client, models, onSubmit }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Business
  const [name, setName] = useState(client?.name ?? '');
  const [domain, setDomain] = useState(client?.domain ?? '');
  const [billingEmail, setBillingEmail] = useState('');

  // Bot config
  const [botName, setBotName] = useState(client?.bot_name ?? 'Assistant');
  const [welcomeMessage, setWelcomeMessage] = useState(
    client?.welcome_message ?? 'Hi! How can I help you today?'
  );
  const [systemPrompt, setSystemPrompt] = useState(
    client?.system_prompt ?? ''
  );
  const [documentContext, setDocumentContext] = useState(
    client?.document_context ?? ''
  );

  // AI model
  const [aiModel, setAiModel] = useState(
    client?.ai_model ?? 'openai/gpt-5-nano'
  );

  // Branding
  const [primaryColor, setPrimaryColor] = useState(
    client?.primary_color ?? '#7C3AED'
  );
  const [borderRadius, setBorderRadius] = useState(
    client?.border_radius ?? 12
  );
  const [position, setPosition] = useState<Position>(
    client?.position ?? 'bottom-right'
  );

  // Customization
  const c = client?.customization ?? {};
  const [botAvatarUrl, setBotAvatarUrl] = useState(c.botAvatarUrl ?? '');
  const [logoUrl, setLogoUrl] = useState(c.logoUrl ?? '');
  const [darkMode, setDarkMode] = useState<DarkMode>(c.darkMode ?? 'light');
  const [widgetSize, setWidgetSize] = useState<WidgetSize>(
    c.widgetSize ?? 'standard'
  );
  const [soundEnabled, setSoundEnabled] = useState(c.soundEnabled !== false);
  const [autoOpenDelay, setAutoOpenDelay] = useState(
    c.autoOpenDelay ? String(c.autoOpenDelay) : ''
  );
  const [greetingDelay, setGreetingDelay] = useState(c.greetingDelay ?? 3);
  const [greetingMessage, setGreetingMessage] = useState(
    c.greetingMessage ?? ''
  );
  const [glowEffect, setGlowEffect] = useState(c.glowEffect ?? false);
  const [bubbleIconUrl, setBubbleIconUrl] = useState(c.bubbleIconUrl ?? '');

  // Starter questions
  const [starterQuestions, setStarterQuestions] = useState<string[]>(
    client?.starter_questions ?? []
  );

  // Plan & limits
  const [plan, setPlan] = useState<Plan>(client?.plan ?? 'starter');
  const [messageLimit, setMessageLimit] = useState(
    client?.message_limit ?? planLimits.starter
  );
  const [showWatermark, setShowWatermark] = useState(
    client?.show_watermark ?? true
  );
  const [conversationExpiryHours, setConversationExpiryHours] = useState(
    client?.conversation_expiry_hours ?? 24
  );

  const handlePlanChange = (newPlan: Plan) => {
    setPlan(newPlan);
    setMessageLimit(planLimits[newPlan]);
  };

  const addStarterQuestion = () => {
    if (starterQuestions.length < 3) {
      setStarterQuestions([...starterQuestions, '']);
    }
  };

  const removeStarterQuestion = (index: number) => {
    setStarterQuestions(starterQuestions.filter((_, i) => i !== index));
  };

  const updateStarterQuestion = (index: number, value: string) => {
    const updated = [...starterQuestions];
    updated[index] = value;
    setStarterQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const customization: ClientCustomization = {};
      if (botAvatarUrl) customization.botAvatarUrl = botAvatarUrl;
      if (logoUrl) customization.logoUrl = logoUrl;
      if (greetingMessage) customization.greetingMessage = greetingMessage;
      if (glowEffect) customization.glowEffect = true;
      if (bubbleIconUrl) customization.bubbleIconUrl = bubbleIconUrl;
      if (autoOpenDelay) customization.autoOpenDelay = parseInt(autoOpenDelay, 10);
      if (greetingDelay !== 3) customization.greetingDelay = greetingDelay;
      if (widgetSize !== 'standard') customization.widgetSize = widgetSize;
      if (!soundEnabled) customization.soundEnabled = false;
      if (darkMode !== 'light') customization.darkMode = darkMode;

      const filteredQuestions = starterQuestions.filter((q) => q.trim());

      await onSubmit({
        name,
        domain,
        bot_name: botName,
        welcome_message: welcomeMessage,
        system_prompt: systemPrompt,
        ai_model: aiModel,
        primary_color: primaryColor,
        border_radius: borderRadius,
        position,
        document_context: documentContext || null,
        customization,
        starter_questions: filteredQuestions.length > 0 ? filteredQuestions : null,
        show_watermark: showWatermark,
        conversation_expiry_hours: conversationExpiryHours,
        plan,
        message_limit: messageLimit,
        billing_email: billingEmail || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain *</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingEmail">Billing Email</Label>
            <Input
              id="billingEmail"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="billing@example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bot Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bot Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="botName">Bot Display Name *</Label>
              <Input
                id="botName"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aiModel">AI Model</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Welcome Message *</Label>
            <Input
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt *</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              placeholder="Describe the business, services, tone, and any guardrails..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="documentContext">
              Document Context{' '}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="documentContext"
              value={documentContext}
              onChange={(e) => setDocumentContext(e.target.value)}
              rows={5}
              placeholder="FAQ content, service descriptions, policies..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border"
                />
                <Input
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="borderRadius">Border Radius</Label>
              <Input
                id="borderRadius"
                type="number"
                min={0}
                max={24}
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
              />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={position}
                onValueChange={(v) => setPosition(v as Position)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Widget Customization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="botAvatarUrl">Bot Avatar URL</Label>
              <Input
                id="botAvatarUrl"
                value={botAvatarUrl}
                onChange={(e) => setBotAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Dark Mode</Label>
              <Select
                value={darkMode}
                onValueChange={(v) => setDarkMode(v as DarkMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Widget Size</Label>
              <Select
                value={widgetSize}
                onValueChange={(v) => setWidgetSize(v as WidgetSize)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact (340x460)</SelectItem>
                  <SelectItem value="standard">Standard (380x520)</SelectItem>
                  <SelectItem value="large">Large (420x600)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoOpenDelay">Auto-Open Delay (sec)</Label>
              <Input
                id="autoOpenDelay"
                type="number"
                min={0}
                value={autoOpenDelay}
                onChange={(e) => setAutoOpenDelay(e.target.value)}
                placeholder="Disabled"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="greetingDelay">Greeting Delay (sec)</Label>
              <Input
                id="greetingDelay"
                type="number"
                min={0}
                value={greetingDelay}
                onChange={(e) =>
                  setGreetingDelay(parseInt(e.target.value, 10) || 3)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="greetingMessage">Greeting Tooltip</Label>
              <Input
                id="greetingMessage"
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                placeholder="Need help?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bubbleIconUrl">Bubble Icon URL</Label>
              <Input
                id="bubbleIconUrl"
                value={bubbleIconUrl}
                onChange={(e) => setBubbleIconUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded"
              />
              Sound Notification
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={glowEffect}
                onChange={(e) => setGlowEffect(e.target.checked)}
                className="rounded"
              />
              Glow Effect
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Starter Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Starter Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {starterQuestions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={q}
                onChange={(e) => updateStarterQuestion(i, e.target.value)}
                placeholder={`Question ${i + 1}`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeStarterQuestion(i)}
              >
                Remove
              </Button>
            </div>
          ))}
          {starterQuestions.length < 3 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStarterQuestion}
            >
              Add Question
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plan & Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan & Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={plan} onValueChange={(v) => handlePlanChange(v as Plan)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter ($19/mo)</SelectItem>
                  <SelectItem value="pro">Pro ($49/mo)</SelectItem>
                  <SelectItem value="agency">Agency ($149/mo)</SelectItem>
                  <SelectItem value="enterprise">Enterprise ($399/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="messageLimit">Message Limit</Label>
              <Input
                id="messageLimit"
                type="number"
                value={messageLimit}
                onChange={(e) =>
                  setMessageLimit(parseInt(e.target.value, 10) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryHours">Conversation Expiry (hours)</Label>
              <Input
                id="expiryHours"
                type="number"
                min={1}
                value={conversationExpiryHours}
                onChange={(e) =>
                  setConversationExpiryHours(parseInt(e.target.value, 10) || 24)
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showWatermark}
              onChange={(e) => setShowWatermark(e.target.checked)}
              className="rounded"
            />
            Show &quot;Powered by Jotil&quot; watermark
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading
            ? client
              ? 'Saving...'
              : 'Creating...'
            : client
              ? 'Save Changes'
              : 'Create Client'}
        </Button>
      </div>
    </form>
  );
}
