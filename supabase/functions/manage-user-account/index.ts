
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return response({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";

    if (!authHeader.startsWith("Bearer ")) {
      return response({ success: false, error: "يجب تسجيل الدخول" }, 401);
    }

    const token = authHeader.slice(7);

    const userClient = createClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: { persistSession: false },
    });

    const { data: userData, error: authError } =
      await userClient.auth.getUser(token);

    if (authError || !userData.user) {
      return response({ success: false, error: "جلسة غير صالحة" }, 401);
    }

    const caller = userData.user;

    const admin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: callerProfile, error: profileError } = await admin
      .from("profiles")
      .select("id, role, approval_status")
      .eq("id", caller.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return response({ success: false, error: "الحساب غير موجود" }, 403);
    }

    const body = await req.json();
    const action = body.action;

    let targetId = caller.id;

    if (action === "admin_delete") {
      if (
        callerProfile.role !== "admin" ||
        callerProfile.approval_status !== "approved"
      ) {
        return response({ success: false, error: "غير مصرح لك" }, 403);
      }

      targetId = String(body.user_id || "");

      if (!targetId || targetId === caller.id) {
        return response({ success: false, error: "حساب غير صالح" }, 400);
      }
    } else if (action !== "self_delete") {
      return response({ success: false, error: "طلب غير معروف" }, 400);
    }

    const { data: target, error: targetError } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", targetId)
      .maybeSingle();

    if (targetError || !target) {
      return response({ success: false, error: "العضو غير موجود" }, 404);
    }

    if (target.role === "admin") {
      return response({
        success: false,
        error: "لا يمكن حذف حساب إداري من هذه الشاشة",
      }, 403);
    }

    // Delete the member's uploaded profile photos.
    const { data: files, error: storageError } =
      await admin.storage.from("profile-photos").list(targetId, {
        limit: 100,
      });

    if (storageError) throw storageError;

    if (files?.length) {
      const paths = files
        .filter((file) => file.name && file.id)
        .map((file) => `${targetId}/${file.name}`);

      if (paths.length) {
        const { error } = await admin.storage
          .from("profile-photos")
          .remove(paths);

        if (error) throw error;
      }
    }

    // Delete the member's approved and pending submissions.
    const { error: submissionsError } = await admin
      .from("activity_submissions")
      .delete()
      .eq("user_id", targetId);

    if (submissionsError) throw submissionsError;

    // Delete the public profile.
    const { error: deleteProfileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", targetId);

    if (deleteProfileError) throw deleteProfileError;

    // Delete the authentication account securely.
    const { error: deleteUserError } =
      await admin.auth.admin.deleteUser(targetId);

    if (deleteUserError) throw deleteUserError;

    return response({ success: true });

  } catch (error) {
    console.error("Account deletion error:", error);

    return response({
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
    }, 500);
  }
});
      
