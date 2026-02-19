-- Add indexes on foreign key columns to improve JOIN and CASCADE performance

CREATE INDEX "Album_createdById_idx" ON "Album"("createdById");
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");
CREATE INDEX "EventHiddenFrom_userId_idx" ON "EventHiddenFrom"("userId");
CREATE INDEX "EventRsvp_userId_idx" ON "EventRsvp"("userId");
CREATE INDEX "GameScore_userId_idx" ON "GameScore"("userId");
CREATE INDEX "InvitationCode_createdById_idx" ON "InvitationCode"("createdById");
CREATE INDEX "Notification_createdById_idx" ON "Notification"("createdById");
CREATE INDEX "Notification_replyId_idx" ON "Notification"("replyId");
CREATE INDEX "Notification_topicId_idx" ON "Notification"("topicId");
CREATE INDEX "PersonTag_photoId_idx" ON "PersonTag"("photoId");
CREATE INDEX "Photo_albumId_idx" ON "Photo"("albumId");
CREATE INDEX "Photo_uploadedById_idx" ON "Photo"("uploadedById");
CREATE INDEX "PhotoComment_authorId_idx" ON "PhotoComment"("authorId");
CREATE INDEX "PhotoComment_photoId_idx" ON "PhotoComment"("photoId");
CREATE INDEX "Reply_authorId_idx" ON "Reply"("authorId");
CREATE INDEX "Reply_quotedReplyId_idx" ON "Reply"("quotedReplyId");
CREATE INDEX "Reply_topicId_idx" ON "Reply"("topicId");
CREATE INDEX "ReplyHistory_replyId_idx" ON "ReplyHistory"("replyId");
CREATE INDEX "Topic_authorId_idx" ON "Topic"("authorId");
CREATE INDEX "Topic_categoryId_idx" ON "Topic"("categoryId");
CREATE INDEX "TopicRead_topicId_idx" ON "TopicRead"("topicId");
