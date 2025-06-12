import { supabase } from '../lib/supabase';
import { trackTokenUsage } from './tokenService';

const BASIC_REVIVAL_ENDPOINTS = {
  blog: {
    'LinkedIn': 'https://hook.us2.make.com/7lmwb7qus8qwguntmwjsqoy4ilk2rrq2',
    'Twitter Post': 'https://hook.us2.make.com/c8jk3g3k58s21newgd6vjbkzmaqd1s2l',
    'Twitter Thread': 'https://hook.us2.make.com/89ih35vmjv74debmqisofqadvckvwfdo',
    'Instagram': 'https://hook.us2.make.com/r19n2yowfvbki8gpv4ewe3x1vynf1l3o',
    'Carousel': 'https://hook.us2.make.com/477e1uef4mzdfl1umo8kr6eu8jvodfq3',
    'Story Breakdown': 'https://hook.us2.make.com/y12im85n4qiwxigzrpmsxldgh05ekl5i',
    'Mini-Guide': 'https://hook.us2.make.com/gdqumkielfxhxmfuy0dyag5qc39laaet'
  },
  industry: {
    'LinkedIn': 'https://hook.us2.make.com/qd7w951wdwnljbm6rtwffei6yt93huk3',
    'Twitter Post': 'https://hook.us2.make.com/qyddrs4x484mzh4kgfp2m94pfuofcox1',
    'Twitter Thread': 'https://hook.us2.make.com/q1u7b0esd1fwthmmxrlhvrpovcrqmd9h',
    'Instagram': 'https://hook.us2.make.com/0vqrqrsdjt9v4sim7tm1y2clwhq4rxlo',
    'Carousel': 'https://hook.us2.make.com/nk85t0nsk65jo8p3hb6vsbpc3frnt6mx',
    'Story Breakdown': 'https://hook.us2.make.com/9ma21guwol1hiba5nm4iujpvghvxtg35',
    'Mini-Guide': 'https://hook.us2.make.com/wnkapn8vobq1xfz057kddiwaoblxwgvg'
  },
  video: {
    'LinkedIn': 'https://hook.us2.make.com/wvlx19gbad7v8hqlagcr85fmx9jm1g4t',
    'Twitter Post': 'https://hook.us2.make.com/jrg1ggv6pc7z1605g19eunovlamxt5sr',
    'Twitter Thread': 'https://hook.us2.make.com/lgja32tbcy9tbqcv903lu9gcegkgw462',
    'Instagram': 'https://hook.us2.make.com/vyiqhsionjw4pl2dh1cyf97dsnvrme8b',
    'Carousel': 'https://hook.us2.make.com/57b470gwv3g5sd7y4mou5qgc36rrmq0l',
    'Story Breakdown': 'https://hook.us2.make.com/gcjl252p2q8yci3kmuxg5guard1yw4pb',
    'Mini-Guide': 'https://hook.us2.make.com/qh09hngu1hbccwcb4q57ob7534m613do'
  },
  image: {
    'LinkedIn': 'https://hook.us2.make.com/6rdkkzaznnb4nw41vhh1kuqw7gy6kjy7',
    'Twitter Post': 'https://hook.us2.make.com/p35cupqkk5unf5uyu4t18ny8mayw9x8b',
    'Twitter Thread': 'https://hook.us2.make.com/h2oplbgf56lhrd92dyj6f9fgjfwcdhou',
    'Instagram': 'https://hook.us2.make.com/cqxhro9k7unplhb5lq59jhbhjrwrrm8n',
    'Carousel': 'https://hook.us2.make.com/i2uxrf278mdrn2iwsiz2wogbbebm6yjp',
    'Story Breakdown': 'https://hook.us2.make.com/ekk65ali56mpsm9oc7l7o9uz7s9cift8',
    'Mini-Guide': 'https://hook.us2.make.com/225si4pphwue6kxcue10pfmkfi2bexfl'
  }
};

export async function reviveContent({ type, url, transcript, image, platform, isEnhanced = false, brandVoice = null }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Track token usage before revival
    const contentToTrack = url || transcript || 'image-content';
    await trackTokenUsage('revival', contentToTrack);

    // Get brand voice settings including selected sections
    const { data: brandVoiceSettings } = await supabase
      .from('brand_voice')
      .select('content_guidelines, personal_stories, emotional_vocabulary, conversational_rhythm, call_to_actions')
      .eq('user_id', user.id)
      .single();

    const endpoints = BASIC_REVIVAL_ENDPOINTS[type];
    if (!endpoints) {
      throw new Error(`Unsupported content type: ${type}`);
    }

    const endpoint = endpoints[platform];
    if (!endpoint) {
      throw new Error(`Unsupported platform for ${type}: ${platform}`);
    }

    let body;
    let headers = {
      'Content-Type': 'application/json'
    };

    // Get selected sections from brand voice settings
    const selectedPEA = brandVoiceSettings?.personal_stories?.selected_story 
      ? brandVoiceSettings.personal_stories.stories.find(s => s.id === brandVoiceSettings.personal_stories.selected_story)
      : null;
    const selectedEVM = brandVoiceSettings?.emotional_vocabulary?.selected_section
      ? brandVoiceSettings.emotional_vocabulary.sections.find(s => s.id === brandVoiceSettings.emotional_vocabulary.selected_section)
      : null;
    const selectedCRS = brandVoiceSettings?.conversational_rhythm?.selected_section
      ? brandVoiceSettings.conversational_rhythm.sections.find(s => s.id === brandVoiceSettings.conversational_rhythm.selected_section)
      : null;
    const selectedCTA = brandVoiceSettings?.call_to_actions?.selected_cta
      ? brandVoiceSettings.call_to_actions.ctas.find(c => c.id === brandVoiceSettings.call_to_actions.selected_cta)
      : null;

    // Prepare brand voice data
    const brandVoiceData = brandVoice ? {
      name: brandVoice.name,
      tone: brandVoice.tone,
      style: brandVoice.style,
      description: brandVoice.description,
      guidelines: brandVoiceSettings?.content_guidelines || '',
      pea: selectedPEA,
      evm: selectedEVM,
      crs: selectedCRS,
      cta: selectedCTA
    } : {
      guidelines: brandVoiceSettings?.content_guidelines || ''
    };

    switch (type) {
      case 'blog':
      case 'video':
      case 'industry':
        body = JSON.stringify({
          url: type === 'video' ? undefined : url,
          transcript: type === 'video' ? transcript : undefined,
          type: type,
          platform,
          brandVoice: brandVoiceData
        });
        break;
      case 'image':
        const formData = new FormData();
        formData.append('image', image);
        formData.append('platform', platform);
        // Send brand voice details in separate nodes
        if (brandVoice) {
          formData.append('brandVoiceName', brandVoice.name);
          formData.append('brandVoiceTone', brandVoice.tone);
          formData.append('brandVoiceStyle', brandVoice.style);
          formData.append('brandVoiceDescription', brandVoice.description);
          formData.append('brandVoiceGuidelines', brandVoiceSettings?.content_guidelines || '');
          if (selectedPEA) formData.append('brandVoicePEA', JSON.stringify(selectedPEA));
          if (selectedEVM) formData.append('brandVoiceEVM', JSON.stringify(selectedEVM));
          if (selectedCRS) formData.append('brandVoiceCRS', JSON.stringify(selectedCRS));
          if (selectedCTA) formData.append('brandVoiceCTA', JSON.stringify(selectedCTA));
        } else {
          formData.append('brandVoiceGuidelines', brandVoiceSettings?.content_guidelines || '');
        }
        body = formData;
        delete headers['Content-Type'];
        break;
      default:
        throw new Error(`Invalid content type: ${type}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body
    });

    if (!response.ok) {
      throw new Error(`Revival failed: ${response.statusText}`);
    }

    const data = await response.text();
    return typeof data === 'string' ? data : JSON.parse(data).content;
  } catch (error) {
    console.error('Content revival error:', error);
    throw new Error('Failed to revive content. Please try again.');
  }
}

export async function saveRevivedContent(content, platformName, contentType, sourceUrl = '', brandVoice = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get platform ID
    const { data: platform } = await supabase
      .from('content_platforms')
      .select('id')
      .eq('name', platformName)
      .single();

    if (!platform) throw new Error(`Platform not found: ${platformName}`);

    // Save the revived content
    const { data, error } = await supabase
      .from('revived_content')
      .insert([{
        content_text: content,
        platform_id: platform.id,
        user_id: user.id,
        original_url: sourceUrl,
        content_type: contentType,
        brand_voice_id: brandVoice?.id || null,
        brand_voice: brandVoice ? {
          name: brandVoice.name,
          tone: brandVoice.tone,
          style: brandVoice.style,
          description: brandVoice.description
        } : null
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('This content has already been revived and saved');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving revived content:', error);
    throw error;
  }
}

export async function updateRevivedContent(id, newContent) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('revived_content')
      .update({ content_text: newContent })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating revived content:', error);
    throw error;
  }
}

export async function deleteRevivedContent(id) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('revived_content')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting revived content:', error);
    throw error;
  }
}

export async function getRevivedContents(platform) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get platform ID
    const { data: platformData } = await supabase
      .from('content_platforms')
      .select('id')
      .ilike('name', platform)
      .single();

    if (!platformData) throw new Error('Platform not found');

    const { data, error } = await supabase
      .from('revived_content')
      .select(`
        *,
        platform:platform_id (
          name,
          icon_name,
          color
        )
      `)
      .eq('user_id', user.id)
      .eq('platform_id', platformData.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      content: item.content_text,
      platform: item.platform.name,
      timestamp: item.created_at,
      content_type: item.content_type,
      brandVoice: item.brand_voice
    }));
  } catch (error) {
    console.error('Error getting revived contents:', error);
    throw error;
  }
}