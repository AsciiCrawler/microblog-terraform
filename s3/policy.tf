resource "aws_iam_policy" "default" {
  name = "bucket-policy-${var.bucket_name}-${random_id.default.hex}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "s3:*"
        Resource = [
          "${aws_s3_bucket.default.arn}",
          "${aws_s3_bucket.default.arn}/*"
        ]
      }
    ]
  })
}