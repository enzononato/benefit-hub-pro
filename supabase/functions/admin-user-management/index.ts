import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const action = body?.action;

    if (action === "create") {
      const email = body?.email as string | undefined;
      const password = body?.password as string | undefined;
      const fullName = body?.fullName as string | undefined;
      const role = body?.role as "admin" | "gestor" | "agente_dp" | undefined;

      if (!email || !password || !fullName || !role) {
        return new Response(
          JSON.stringify({ error: "Missing email, password, fullName or role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!(["admin", "gestor", "agente_dp"] as const).includes(role)) {
        return new Response(
          JSON.stringify({ error: "Invalid role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          app_role: role,
        },
      });

      if (createError || !created?.user) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: createError?.message || "Error creating user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newUserId = created.user.id;

      // Ensure profile exists/updated
      const { data: updatedProfile, error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name: fullName, email })
        .eq("user_id", newUserId)
        .select("id");

      if (updateProfileError) {
        console.error("Error updating profile:", updateProfileError);
      }

      if (!updatedProfile || updatedProfile.length === 0) {
        const { error: insertProfileError } = await supabaseAdmin
          .from("profiles")
          .insert({ user_id: newUserId, full_name: fullName, email });

        if (insertProfileError) {
          console.error("Error inserting profile:", insertProfileError);
          return new Response(
            JSON.stringify({ error: "User created, but failed to create profile" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Replace any existing roles and set the chosen one
      await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);

      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role });

      if (roleInsertError) {
        console.error("Error inserting role:", roleInsertError);
        return new Response(
          JSON.stringify({ error: "User created, but failed to assign role" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, userId: newUserId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      const userId = body?.userId as string | undefined;

      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Try to delete from auth.users (but ALWAYS clean up public tables afterward)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError && !(deleteError.message.includes("not found") || deleteError.status === 404)) {
        console.error("Error deleting user from auth:", deleteError);
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: rolesCleanupError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      const { error: profileCleanupError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (rolesCleanupError) console.error("Error cleaning user_roles:", rolesCleanupError);
      if (profileCleanupError) console.error("Error cleaning profiles:", profileCleanupError);

      return new Response(
        JSON.stringify({
          success: true,
          message: "User deleted successfully",
          auth_deleted: !deleteError,
          roles_cleaned: !rolesCleanupError,
          profile_cleaned: !profileCleanupError,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "changePassword") {
      const userId = body?.userId as string | undefined;
      const newPassword = body?.newPassword as string | undefined;

      if (!userId || !newPassword) {
        return new Response(
          JSON.stringify({ error: "Missing userId or newPassword" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        console.error("Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Password updated successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
